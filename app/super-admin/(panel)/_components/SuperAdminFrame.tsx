"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ClipboardList,
  LayoutDashboard,
  Menu,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  SUPER_ADMIN_NAV,
  type SuperAdminNavKey,
} from "./presentation";
import { SuperAdminLogoutButton } from "../SuperAdminLogoutButton";

const NAV_ICONS = {
  home: LayoutDashboard,
  users: Users,
  admins: ShieldCheck,
  "audit-logs": ClipboardList,
} as const;

function NavLinks({
  active,
  onNavigate,
  className,
}: {
  active: SuperAdminNavKey;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("space-y-1", className)} aria-label="قائمة الإدارة العليا">
      {SUPER_ADMIN_NAV.map((item) => {
        const Icon = NAV_ICONS[item.key];
        const isActive = active === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-blue-50 font-medium text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function BrandBlock({ email }: { email?: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="relative h-11 w-11 shrink-0">
          <Image
            src="/uob-logo.png"
            alt="شعار جامعة البصرة"
            fill
            sizes="44px"
            className="object-contain"
            priority
          />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-[11px] text-slate-500">جامعة البصرة</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">واحة الباحث</p>
          <p className="mt-0.5 text-[11px] font-medium text-[#2563EB]">الإدارة العليا</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Shield className="h-3.5 w-3.5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-800">نطاق الإدارة العليا</p>
            <p className="truncate text-[11px] text-slate-500" dir="ltr">
              {email || "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SuperAdminFrame({
  children,
  active,
  email,
}: {
  children: React.ReactNode;
  active: SuperAdminNavKey;
  email?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-[#F5F7FB] bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.06),_transparent_55%)]"
      dir="rtl"
    >
      {/* Desktop sidebar */}
      <aside className="fixed right-0 top-0 z-40 hidden h-screen w-60 flex-col border-l border-slate-200/80 bg-white shadow-sm md:flex">
        <div className="border-b border-slate-100 px-4 py-4">
          <BrandBlock email={email} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            التنقل
          </p>
          <NavLinks active={active} />
        </div>
        <div className="border-t border-slate-100 px-3 py-3">
          <SuperAdminLogoutButton variant="sidebar" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Shield className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">الإدارة العليا</p>
              <p className="truncate text-[11px] text-slate-500" dir="ltr">
                {email}
              </p>
            </div>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 rounded-lg border-slate-200 p-0"
                aria-label="فتح القائمة"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] p-0 sm:max-w-[300px] [&>button]:left-4 [&>button]:right-auto"
              dir="rtl"
            >
              <SheetHeader className="border-b border-slate-100 px-4 py-4 pl-12 text-right">
                <SheetTitle className="text-sm font-semibold text-slate-900">
                  قائمة الإدارة العليا
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-4 px-3 py-4">
                <BrandBlock email={email} />
                <NavLinks active={active} onNavigate={() => setOpen(false)} />
                <div className="border-t border-slate-100 pt-3">
                  <SuperAdminLogoutButton variant="sidebar" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="md:mr-60">
        <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">{children}</div>
      </main>
    </div>
  );
}
