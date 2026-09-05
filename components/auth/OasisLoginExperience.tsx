"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { OasisLoginShell } from "./OasisLoginShell";

function LoginAuthFormInner() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    identifier: "",
    password: "",
    forgotEmail: "",
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setShowToast(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const nextErrors = {
      identifier: formData.identifier.trim() ? "" : "يرجى إدخال البريد الجامعي أو اسم المستخدم.",
      password: formData.password ? "" : "يرجى إدخال كلمة المرور.",
      forgotEmail: "",
    };
    setValidationErrors(nextErrors);
    if (nextErrors.identifier || nextErrors.password) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.identifier,
          password: formData.password,
          rememberMe,
        }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "حدث خطأ أثناء تسجيل الدخول");
        setLoading(false);
        return;
      }

      if (!data?.success) {
        setError("فشل تسجيل الدخول، يرجى المحاولة مرة أخرى");
        setLoading(false);
        return;
      }

      const roles: string[] = Array.isArray(data?.user?.roles) ? data.user.roles : [];
      const target = roles.includes("ADMIN") ? "/admin/dashboard" : "/researcher/dashboard";
      window.location.href = target;
    } catch {
      setError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = forgotEmail.trim()
      ? ""
      : "يرجى إدخال البريد الجامعي لاستعادة كلمة المرور.";
    setValidationErrors((prev) => ({ ...prev, forgotEmail: message }));
    if (message) return;
    setShowForgotModal(false);
    setForgotEmail("");
  };

  return (
    <>
      <div className="mb-7">
        <div className="oasis-form-brand flex flex-col items-center text-center gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight tracking-tight">
            واحة الباحث
          </h1>
          <p className="font-inter text-[0.8rem] sm:text-[0.85rem] font-medium text-slate-400 tracking-[0.08em]">
            Oasis Research Platform
          </p>
        </div>
        <div className="pt-5 space-y-1 text-center sm:text-right">
          <h2 className="text-lg font-semibold text-slate-800">مرحبًا بك</h2>
          <p className="text-sm text-slate-500">أدخل بيانات حسابك للوصول إلى منصتك البحثية.</p>
        </div>
      </div>

      {searchParams.get("registered") === "true" && (
        <div
          className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
          <p>تم إنشاء الحساب بنجاح، يمكنك الآن تسجيل الدخول.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="identifier" className="text-sm font-medium text-slate-700">
            البريد الجامعي أو اسم المستخدم
          </Label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id="identifier"
              type="text"
              placeholder="name@uobasrah.edu.iq"
              value={formData.identifier}
              onChange={(e) => {
                setFormData({ ...formData, identifier: e.target.value });
                if (validationErrors.identifier) {
                  setValidationErrors((prev) => ({ ...prev, identifier: "" }));
                }
              }}
              className="h-12 rounded-xl border-slate-200 bg-white pr-10 text-sm focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB]"
              dir="ltr"
              required
              autoFocus
              disabled={loading}
            />
          </div>
          {validationErrors.identifier && (
            <p className="text-xs text-red-600">{validationErrors.identifier}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-slate-700">
            كلمة المرور
          </Label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (validationErrors.password) {
                  setValidationErrors((prev) => ({ ...prev, password: "" }));
                }
              }}
              onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
              onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
              className="h-12 rounded-xl border-slate-200 bg-white pr-10 pl-10 text-sm focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB]"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 rounded"
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {validationErrors.password && (
            <p className="text-xs text-red-600">{validationErrors.password}</p>
          )}
          {capsLockOn && (
            <p className="text-xs text-amber-600">تنبيه: زر Caps Lock مفعل.</p>
          )}
        </div>

        <div className="flex items-start justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-[#2563EB] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:underline"
            disabled={loading}
          >
            نسيت كلمة المرور؟
          </button>
          <label className="flex items-start gap-2 text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]/20"
              disabled={loading}
            />
            <span>
              تذكرني
              <span className="block text-[11px] text-slate-400">
                احفظ بيانات الدخول على هذا الجهاز.
              </span>
            </span>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-[#2563EB] text-white font-semibold hover:bg-[#1D4ED8]"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري تسجيل الدخول...
            </>
          ) : (
            "تسجيل الدخول"
          )}
        </Button>

        <p className="text-center text-sm text-slate-500">
          ليس لديك حساب؟{" "}
          <Link
            href="/register"
            className="font-medium text-[#2563EB] hover:text-[#1D4ED8] focus-visible:underline"
          >
            إنشاء حساب جديد
          </Link>
        </p>
      </form>

      {showToast && (
        <Toast
          message="تم إنشاء الحساب بنجاح، يمكنك الآن تسجيل الدخول."
          type="success"
          duration={2000}
          onClose={() => setShowToast(false)}
        />
      )}

      {showForgotModal && (
        <ForgotPasswordModal
          email={forgotEmail}
          error={validationErrors.forgotEmail}
          onClose={() => setShowForgotModal(false)}
          onChange={(value) => {
            setForgotEmail(value);
            if (validationErrors.forgotEmail) {
              setValidationErrors((prev) => ({ ...prev, forgotEmail: "" }));
            }
          }}
          onSubmit={handleForgotSubmit}
        />
      )}
    </>
  );
}

type ForgotPasswordModalProps = {
  email: string;
  error: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
};

function ForgotPasswordModal({
  email,
  error,
  onChange,
  onSubmit,
  onClose,
}: ForgotPasswordModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm"
        aria-label="إغلاق"
        onClick={onClose}
      />
      <Card className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="text-center space-y-1 mb-4">
          <div className="text-sm font-semibold text-slate-800">استعادة كلمة المرور</div>
          <div className="text-xs text-slate-500">أدخل بريدك الجامعي لإرسال رابط الاستعادة.</div>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="forgotEmail" className="text-xs font-medium text-slate-600">
              البريد الجامعي
            </Label>
            <Input
              id="forgotEmail"
              type="email"
              placeholder="name@uobasrah.edu.iq"
              value={email}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 rounded-xl border-slate-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB]"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
              إرسال الرابط
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function OasisLoginExperience() {
  return (
    <OasisLoginShell>
      <Suspense fallback={<div className="min-h-[240px]" aria-hidden="true" />}>
        <LoginAuthFormInner />
      </Suspense>
    </OasisLoginShell>
  );
}
