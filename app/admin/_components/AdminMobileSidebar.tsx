"use client";

import Image from "next/image";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminNavItem } from "./AdminNavItem";
import { AdminNavGroup } from "./AdminNavGroup";
import { adminMobileMenuItems, isAdminMenuGroup } from "./adminMenuItems";

interface AdminMobileSidebarProps {
  userName: string;
  onClose?: () => void;
}

export function AdminMobileSidebar({ userName, onClose }: AdminMobileSidebarProps) {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <aside className="flex h-full w-64 flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
        <div className="relative h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-white shadow-sm border border-gray-100">
          <Image
            src="/uob-logo.png"
            alt="شعار جامعة البصرة"
            fill
            sizes="40px"
            className="object-contain p-1.5"
            priority
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">واحة الباحث</span>
          <span className="text-xs text-[#2563EB]">لوحة الإدارة</span>
        </div>
      </div>

      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB]/10">
            <Shield className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500">مدير النظام</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {adminMobileMenuItems.map((item) => (
          <div key={item.href} onClick={onClose}>
            {isAdminMenuGroup(item) ? (
              <AdminNavGroup group={item} onNavigate={onClose} />
            ) : (
              <AdminNavItem {...item} />
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 px-4 py-4">
        <Button
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50"
          size="sm"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 ml-2" />
          تسجيل الخروج
        </Button>
      </div>
    </aside>
  );
}
