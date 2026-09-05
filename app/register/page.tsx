"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { Card } from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { register } from "./actions";
import { Toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { ENTITIES, DEPARTMENTS_BY_ENTITY } from "@/lib/entities";
import { cn } from "@/lib/utils";

const ACADEMIC_TITLES = ["أستاذ", "أستاذ مساعد", "مدرس", "مدرس مساعد"];

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [showToast, setShowToast] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullNameAr: "",
    fullNameEn: "",
    phone: "",
    academicTitle: "",
    entity: "",
    department: "",
  });

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!formData.email.endsWith("@uobasrah.edu.iq")) {
      newErrors.email = "يجب أن يكون البريد من نطاق @uobasrah.edu.iq";
    }

    if (!formData.password) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (formData.password.length < 8) {
      newErrors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "تأكيد كلمة المرور مطلوب";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "كلمات المرور غير متطابقة";
    }

    if (!formData.fullNameAr) {
      newErrors.fullNameAr = "الاسم بالعربية مطلوب";
    }

    if (!formData.fullNameEn) {
      newErrors.fullNameEn = "الاسم بالإنجليزية مطلوب";
    }

    if (!formData.phone) {
      newErrors.phone = "رقم الهاتف مطلوب";
    } else {
      const phoneRegex = /^\+964[0-9]{9,10}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "يجب أن يبدأ الرقم بـ +964 ويتبعه 9-10 أرقام";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.academicTitle) {
      newErrors.academicTitle = "اللقب العلمي مطلوب";
    }

    if (!formData.entity) {
      newErrors.entity = "الكلية/التشكيل مطلوب";
    }

    if (!acceptedTerms) {
      newErrors.terms = "يجب الموافقة على الشروط والأحكام";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.startsWith("964")) {
      setFormData({ ...formData, phone: `+${value}` });
    } else if (value.length > 0) {
      setFormData({ ...formData, phone: `+964${value}` });
    } else {
      setFormData({ ...formData, phone: "+964" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setSubmitError("");
    setErrors({});

    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("email", formData.email);
      formDataToSubmit.append("password", formData.password);
      formDataToSubmit.append("confirmPassword", formData.confirmPassword);
      formDataToSubmit.append("fullNameAr", formData.fullNameAr);
      formDataToSubmit.append("fullNameEn", formData.fullNameEn);
      formDataToSubmit.append("phone", formData.phone);
      formDataToSubmit.append("academicTitle", formData.academicTitle);
      formDataToSubmit.append("entity", formData.entity);
      if (formData.department && formData.department !== "لا توجد أقسام") {
        formDataToSubmit.append("department", formData.department);
      }

      const result = await register(formDataToSubmit);

      console.log("[Client] Register result:", result);

      if (!result) {
        console.error("[Client] No result returned from server action");
        setSubmitError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
        setLoading(false);
        return;
      }

      if (result.error) {
        console.log("[Client] Error:", result.error);
        if (result.field) {
          setErrors({ [result.field]: result.error });
        } else {
          setSubmitError(result.error);
        }
        setLoading(false);
        return;
      }

      if (result.success) {
        console.log("[Client] Success! Showing toast...");
        setShowToast(true);
        setLoading(false);

        setTimeout(() => {
          console.log("[Client] Redirecting to login...");
          router.push("/login?registered=true");
        }, 2000);
        return;
      }

      console.error("[Client] Unexpected result:", result);
      setSubmitError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      setLoading(false);
    } catch {
      setSubmitError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      setLoading(false);
    }
  };

  const inputClass = (hasError?: boolean) =>
    cn(
      "h-11 rounded-xl border bg-white text-sm focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB]",
      hasError ? "border-red-300" : "border-slate-200"
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(219,234,254,0.55),_transparent_55%)]" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 py-8 md:py-12">
        <div className="mb-8 flex flex-col items-center text-center gap-3">
          <div className="relative h-16 w-16 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <Image
              src="/uob-logo.png"
              alt="شعار جامعة البصرة"
              width={64}
              height={64}
              className="object-contain w-full h-full"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">إنشاء حساب جديد</h1>
            <p className="mt-1 text-sm text-slate-500">
              تسجيل حساب تدريسي في واحة الباحث – جامعة البصرة
            </p>
            <p className="font-inter text-xs text-slate-400 mt-1">Oasis Research Platform</p>
          </div>
        </div>

        <Card className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 pb-5 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                currentStep === 1
                  ? "bg-blue-50 border border-blue-200 text-[#2563EB]"
                  : "text-slate-400"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs text-white",
                  currentStep === 1 ? "bg-[#2563EB]" : "bg-slate-300"
                )}
              >
                1
              </span>
              المعلومات الشخصية
            </button>
            <ArrowLeft className="h-4 w-4 text-slate-300 rotate-180 sm:rotate-0" aria-hidden="true" />
            <button
              type="button"
              onClick={() => currentStep === 2 && setCurrentStep(2)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                currentStep === 2
                  ? "bg-blue-50 border border-blue-200 text-[#2563EB]"
                  : "text-slate-400"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs text-white",
                  currentStep === 2 ? "bg-[#2563EB]" : "bg-slate-300"
                )}
              >
                2
              </span>
              المعلومات الأكاديمية
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {submitError}
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    البريد الإلكتروني *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@uobasrah.edu.iq"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={cn(inputClass(!!errors.email), "pr-10")}
                      dir="ltr"
                      required
                      disabled={loading}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                  <p className="text-xs text-slate-500">يجب إدخال البريد الجامعي الرسمي</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                    كلمة المرور *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={cn(inputClass(!!errors.password), "pr-10 pl-10")}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                    تأكيد كلمة المرور *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      className={cn(inputClass(!!errors.confirmPassword), "pr-10 pl-10")}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={
                        showConfirmPassword ? "إخفاء تأكيد كلمة المرور" : "إظهار تأكيد كلمة المرور"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullNameAr" className="text-sm font-medium text-slate-700">
                      الاسم بالعربية *
                    </Label>
                    <Input
                      id="fullNameAr"
                      type="text"
                      placeholder="أدخل الاسم الكامل بالعربية"
                      value={formData.fullNameAr}
                      onChange={(e) => setFormData({ ...formData, fullNameAr: e.target.value })}
                      className={cn(inputClass(!!errors.fullNameAr), "text-right")}
                      dir="rtl"
                      required
                      disabled={loading}
                    />
                    {errors.fullNameAr && (
                      <p className="text-xs text-red-600">{errors.fullNameAr}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullNameEn" className="text-sm font-medium text-slate-700">
                      الاسم بالإنجليزية *
                    </Label>
                    <Input
                      id="fullNameEn"
                      type="text"
                      placeholder="Enter full name in English"
                      value={formData.fullNameEn}
                      onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value })}
                      className={cn(inputClass(!!errors.fullNameEn), "text-left")}
                      dir="ltr"
                      required
                      disabled={loading}
                    />
                    {errors.fullNameEn && (
                      <p className="text-xs text-red-600">{errors.fullNameEn}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                    رقم الهاتف *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                      +964
                    </div>
                    <Input
                      id="phone"
                      type="text"
                      placeholder="7501234567"
                      value={formData.phone.replace("+964", "")}
                      onChange={handlePhoneChange}
                      className={cn(inputClass(!!errors.phone), "pr-10 pl-16")}
                      dir="ltr"
                      required
                      disabled={loading}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
                </div>

                <Button
                  type="button"
                  onClick={handleNext}
                  className="w-full h-11 rounded-xl bg-[#2563EB] text-white font-medium hover:bg-[#1D4ED8]"
                  disabled={loading}
                >
                  التالي
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="academicTitle" className="text-sm font-medium text-slate-700">
                    اللقب العلمي *
                  </Label>
                  <Select
                    value={formData.academicTitle}
                    onValueChange={(value) => setFormData({ ...formData, academicTitle: value })}
                  >
                    <SelectTrigger className={inputClass(!!errors.academicTitle)}>
                      <SelectValue placeholder="اختر اللقب العلمي" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_TITLES.map((title) => (
                        <SelectItem key={title} value={title}>
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.academicTitle && (
                    <p className="text-xs text-red-600">{errors.academicTitle}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity" className="text-sm font-medium text-slate-700">
                    الكلية/التشكيل *
                  </Label>
                  <Select
                    value={formData.entity}
                    onValueChange={(value) => {
                      const depts = DEPARTMENTS_BY_ENTITY[value] ?? [];
                      const noDepts = depts.length === 0 && value in DEPARTMENTS_BY_ENTITY;
                      setFormData({
                        ...formData,
                        entity: value,
                        department: noDepts ? "لا توجد أقسام" : "",
                      });
                    }}
                  >
                    <SelectTrigger className={inputClass(!!errors.entity)}>
                      <SelectValue placeholder="اختر الكلية/التشكيل" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITIES.map((entity) => (
                        <SelectItem key={entity} value={entity}>
                          {entity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.entity && <p className="text-xs text-red-600">{errors.entity}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium text-slate-700">
                    القسم
                  </Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                    disabled={!formData.entity}
                  >
                    <SelectTrigger
                      className="h-11 rounded-xl border border-slate-200 bg-white text-sm"
                      disabled={!formData.entity}
                    >
                      <SelectValue
                        placeholder={formData.entity ? "اختر القسم" : "اختر الكلية/التشكيل أولاً"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(DEPARTMENTS_BY_ENTITY[formData.entity] ?? []).length > 0 ? (
                        DEPARTMENTS_BY_ENTITY[formData.entity].map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))
                      ) : formData.entity in DEPARTMENTS_BY_ENTITY ? (
                        <SelectItem value="لا توجد أقسام">لا توجد أقسام</SelectItem>
                      ) : (
                        <SelectItem value="placeholder">قريباً</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {!formData.entity && (
                    <p className="text-xs text-slate-400">اختر الكلية/التشكيل أولاً</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]/20"
                      required
                    />
                    <span className="text-sm text-slate-700">
                      أوافق على{" "}
                      <Link href="/terms" className="text-[#2563EB] hover:underline">
                        الشروط والأحكام
                      </Link>{" "}
                      و{" "}
                      <Link href="/privacy" className="text-[#2563EB] hover:underline">
                        سياسة الخصوصية
                      </Link>
                    </span>
                  </label>
                  {errors.terms && <p className="text-xs text-red-600">{errors.terms}</p>}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-11 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                    disabled={loading}
                  >
                    <ArrowRight className="ml-2 h-4 w-4" />
                    رجوع
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 rounded-xl bg-[#2563EB] text-white font-medium hover:bg-[#1D4ED8]"
                    disabled={loading || !acceptedTerms}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      "إنشاء حساب"
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center text-sm pt-4 border-t border-slate-100">
              <span className="text-slate-500">لديك حساب بالفعل؟ </span>
              <Link href="/login" className="font-medium text-[#2563EB] hover:underline">
                تسجيل الدخول
              </Link>
            </div>
          </form>
        </Card>
      </div>

      {showToast && (
        <Toast
          message="تم إنشاء الحساب بنجاح"
          type="success"
          duration={2000}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
