"use client";

import Image from "next/image";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminNavItem } from "./AdminNavItem";
import { AdminNavGroup } from "./AdminNavGroup";
import { adminMainMenuItems, adminDataMenuItems, isAdminMenuGroup } from "./adminMenuItems";

interface AdminSidebarProps {
  userName: string;
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 min-w-[256px] max-w-[256px] z-40 flex flex-col border-l border-gray-200 bg-white shadow-lg overflow-x-hidden">
      <div className="border-b border-gray-100 px-6 py-5 flex-shrink-0">
        <div className="flex items-start gap-3">
          <div className="relative h-14 w-14 flex-shrink-0">
            <Image
              src="/uob-logo.png"
              alt="شعار جامعة البصرة"
              fill
              sizes="56px"
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col items-start leading-tight mt-1 min-w-0 flex-1">
            <span className="text-xs text-slate-500 mb-1 truncate w-full">جامعة البصرة</span>
            <span className="text-sm font-semibold text-slate-900 truncate w-full">واحة الباحث</span>
            <span className="text-[11px] font-medium text-[#2563EB] tracking-wide truncate w-full mt-0.5">
              لوحة الإدارة
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-100 px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]/10">
            <Shield className="h-4 w-4 text-[#2563EB]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500">مدير النظام</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4">
        <NavGroup title="الرئيسية">
          {adminMainMenuItems.map((item) => (
            <AdminNavItem key={item.href} {...item} />
          ))}
        </NavGroup>

        <NavGroup title="البيانات الأكاديمية">
          {adminDataMenuItems.map((item) =>
            isAdminMenuGroup(item) ? (
              <AdminNavGroup key={item.href} group={item} />
            ) : (
              <AdminNavItem key={item.href} {...item} />
            )
          )}
        </NavGroup>
      </nav>

      <div className="border-t border-gray-100 px-4 py-4 flex-shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </aside>
  );
}
