"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { LineChart } from "@/components/charts/line-chart";

function LoginPageContent() {
  const router = useRouter();
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
        body: JSON.stringify({ email: formData.identifier, password: formData.password, rememberMe }),
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
    const message = forgotEmail.trim() ? "" : "يرجى إدخال البريد الجامعي لاستعادة كلمة المرور.";
    setValidationErrors((prev) => ({ ...prev, forgotEmail: message }));
    if (message) return;
    setShowForgotModal(false);
    setForgotEmail("");
  };

  return (
    <LoginLayout>
      <div className="order-1 lg:order-1 flex justify-center" dir="rtl">
        <LoginCard
          formData={formData}
          rememberMe={rememberMe}
          loading={loading}
          error={error}
          showPassword={showPassword}
          capsLockOn={capsLockOn}
          validationErrors={validationErrors}
          onSubmit={handleSubmit}
          onRememberChange={setRememberMe}
          onShowPasswordToggle={() => setShowPassword((prev) => !prev)}
          onIdentifierChange={(value) => {
            setFormData({ ...formData, identifier: value });
            if (validationErrors.identifier) {
              setValidationErrors((prev) => ({ ...prev, identifier: "" }));
            }
          }}
          onPasswordChange={(value) => {
            setFormData({ ...formData, password: value });
            if (validationErrors.password) {
              setValidationErrors((prev) => ({ ...prev, password: "" }));
            }
          }}
          onCapsLockChange={setCapsLockOn}
          onForgotPassword={() => setShowForgotModal(true)}
        />
      </div>

      <div className="order-2 lg:order-2 flex flex-col gap-6 items-start" dir="rtl">
        <LoginBranding />
        <LoginInsightCard />
      </div>

      {showToast && (
        <Toast
          message="تم إنشاء الحساب بنجاح"
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
    </LoginLayout>
  );
}

function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F3F6FB]" dir="rtl">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(219,233,255,0.7),_transparent_60%)] pointer-events-none" />

      <div className="container max-w-6xl mx-auto px-4 md:px-8 min-h-screen flex items-center justify-center py-8 relative z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-[520px_1fr] gap-12 lg:items-center" dir="ltr">
          {children}
        </div>
      </div>
    </div>
  );
}

function LoginBranding() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="text-4xl md:text-5xl font-bold text-slate-700">واحة الباحث</div>
        <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-full bg-white shadow-sm">
          <Image
            src="/uob-logo.png"
            alt="شعار جامعة البصرة"
            fill
            className="object-contain p-2"
            priority
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-base text-slate-400">
        <span>Oasis Research Platform</span>
        <span className="text-blue-500">✨</span>
      </div>
    </div>
  );
}

function LoginInsightCard() {
  const chartData = [
    { name: "يناير", value: 12 },
    { name: "فبراير", value: 18 },
    { name: "مارس", value: 16 },
    { name: "أبريل", value: 22 },
    { name: "مايو", value: 20 },
    { name: "يونيو", value: 26 },
  ];

  return (
    <Card className="rounded-2xl border border-slate-200/40 bg-white/80 backdrop-blur-sm shadow-[0_12px_28px_rgba(15,23,42,0.08)] p-5 w-full max-w-[600px] min-w-[520px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-emerald-500">+12.5% ↗</span>
        <span className="text-sm text-slate-600">نظرة سريعة</span>
      </div>
      <div className="relative h-36 rounded-lg bg-slate-50/70">
        <div className="absolute inset-0 p-3">
          <LineChart
            data={chartData}
            dataKeys={[{ key: "value", stroke: "#3b82f6" }]}
            showDots
            gridOpacity={0.08}
            tickFontSize={10}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-blue-600 rounded-b-lg" />
      </div>
    </Card>
  );
}

type LoginCardProps = {
  formData: { identifier: string; password: string };
  rememberMe: boolean;
  loading: boolean;
  error: string;
  showPassword: boolean;
  capsLockOn: boolean;
  validationErrors: { identifier: string; password: string };
  onSubmit: (e: React.FormEvent) => void;
  onRememberChange: (value: boolean) => void;
  onShowPasswordToggle: () => void;
  onIdentifierChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onCapsLockChange: (value: boolean) => void;
  onForgotPassword: () => void;
};

function LoginCard({
  formData,
  rememberMe,
  loading,
  error,
  showPassword,
  capsLockOn,
  validationErrors,
  onSubmit,
  onRememberChange,
  onShowPasswordToggle,
  onIdentifierChange,
  onPasswordChange,
  onCapsLockChange,
  onForgotPassword,
}: LoginCardProps) {
  return (
    <Card className="rounded-2xl border border-slate-200/40 bg-white/80 backdrop-blur-sm shadow-[0_14px_32px_rgba(15,23,42,0.12)] p-7 md:p-8 w-full max-w-[520px] min-w-[480px]">
      <div className="mb-5 flex w-full flex-col items-center gap-2 text-center">
        <h2 className="text-2xl font-bold text-slate-700">تسجيل الدخول</h2>
        <p className="text-sm text-slate-500">
          مرحباً بعودتك، سجل دخولك لمتابعة إنجازاتك البحثية.
        </p>
        <div className="h-px w-full bg-slate-200/70" />
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200/70 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-xs font-medium text-slate-500">
                البريد الجامعي أو اسم المستخدم
              </Label>
              <div className="relative">
                <Input
                  id="identifier"
                  type="text"
                  placeholder="admin@basrasearch.com"
                  value={formData.identifier}
                  onChange={(e) => onIdentifierChange(e.target.value)}
                  className="h-12 rounded-lg border-slate-200 bg-blue-50/60 text-sm focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:border-blue-300 pr-10 pl-10"
                  dir="ltr"
                  required
                  autoFocus
                  disabled={loading}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              {validationErrors.identifier && (
                <p className="text-[11px] text-rose-500">{validationErrors.identifier}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-slate-500">
                كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  onKeyUp={(e) => onCapsLockChange(e.getModifierState("CapsLock"))}
                  onKeyDown={(e) => onCapsLockChange(e.getModifierState("CapsLock"))}
                  className="h-12 rounded-lg border-slate-200 bg-blue-50/60 text-sm focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:border-blue-300 pr-10 pl-10"
                  required
                  disabled={loading}
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <button
                  type="button"
                  onClick={onShowPasswordToggle}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-[11px] text-rose-500">{validationErrors.password}</p>
              )}
              {capsLockOn && (
                <p className="text-[11px] text-amber-500">تنبيه: زر Caps Lock مفعل.</p>
              )}
            </div>

            <div className="flex items-start justify-between text-xs">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-blue-600 hover:text-blue-700"
                disabled={loading}
              >
                نسيت كلمة المرور؟
              </button>
              <label className="flex items-start gap-2 text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => onRememberChange(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-100 mt-0.5"
                  disabled={loading}
                />
                <span>
                  تذكرني
                  <span className="block text-[11px] text-slate-400">احفظ بيانات الدخول على هذا الجهاز.</span>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>

            <div className="text-center text-xs text-slate-500">
              ليس لديك حساب؟{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                إنشاء حساب
              </Link>
            </div>
          </form>
        </Card>
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
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />
      <Card className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200/60 bg-white/90 backdrop-blur p-5 shadow-xl">
        <div className="text-center space-y-1 mb-4">
          <div className="text-sm font-semibold text-slate-700">استعادة كلمة المرور</div>
          <div className="text-xs text-slate-500">أدخل بريدك الجامعي لإرسال رابط الاستعادة.</div>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="forgotEmail" className="text-xs font-medium text-slate-500">
              البريد الجامعي
            </Label>
            <Input
              id="forgotEmail"
              type="email"
              placeholder="name@uobasrah.edu.iq"
              value={email}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 rounded-lg border-slate-200 bg-slate-50/60 text-sm focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:border-blue-300"
            />
            {error && <p className="text-[11px] text-rose-500">{error}</p>}
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
              إرسال الرابط
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F7FB]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
