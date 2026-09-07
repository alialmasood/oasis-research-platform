"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Lock, Mail, Shield } from "lucide-react";

export function SuperAdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/super-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        setError("تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.");
        setLoading(false);
        return;
      }

      window.location.href = "/super-admin";
    } catch {
      setError("تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.");
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#F5F7FB] bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.08),_transparent_50%)] px-4 py-10"
      dir="rtl"
    >
      <div className="w-full max-w-md px-1">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 pb-5 pt-6 text-center sm:px-6 sm:pt-7">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-slate-100 bg-slate-50 sm:mb-4 sm:h-16 sm:w-16">
              <Image
                src="/uob-logo.png"
                alt="جامعة البصرة"
                width={48}
                height={48}
                className="h-10 w-10 object-contain sm:h-12 sm:w-12"
                priority
              />
            </div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
              <Shield className="h-3.5 w-3.5" aria-hidden />
              دخول الإدارة العليا
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              الإدارة العليا
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              نطاق مقيّد لإدارة حسابات المنصة — منفصل عن دخول الإدارة العادية.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-rose-200/80 bg-rose-50/70 px-3 py-2.5 text-sm text-rose-700"
              >
                {error}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="super-admin-email" className="text-sm font-medium text-slate-700">
                البريد الإلكتروني
              </Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  id="super-admin-email"
                  type="email"
                  autoComplete="username"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-lg border-slate-200 pr-10 text-left"
                  placeholder="super-admin@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="super-admin-password" className="text-sm font-medium text-slate-700">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  id="super-admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-lg border-slate-200 pr-10 pl-10 text-left"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-lg bg-blue-600 text-sm font-medium hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
