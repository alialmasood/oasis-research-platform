"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  BookOpen,
  FileText,
  FolderOpen,
  Award,
  BarChart3,
  FileCheck,
  Users,
  Download,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavItem } from "./NavItem";

interface MobileSidebarProps {
  user: {
    fullName: string;
    department?: string;
  };
}

const menuItems = [
  { href: "/researcher/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/researcher/profile", label: "الملف الشخصي", icon: User },
  { href: "/researcher/research", label: "البحوث", icon: BookOpen },
  { href: "/researcher/activities", label: "النشاطات الأكاديمية", icon: FileText },
  { href: "/researcher/documents", label: "الوثائق", icon: FolderOpen },
  { href: "/researcher/evaluation", label: "التقييم والنقاط", icon: Award },
  { href: "/researcher/comparison", label: "المقارنات", icon: BarChart3 },
  { href: "/researcher/cv", label: "السيرة الذاتية", icon: FileCheck },
  { href: "/researcher/online", label: "المتصلون", icon: Users },
];

export function MobileSidebar({ user }: MobileSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside className="flex h-full w-64 flex-col border-l border-gray-200 bg-white shadow-lg">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-white shadow-sm border border-gray-100">
          <Image
            src="/uob-logo.png"
            alt="شعار جامعة البصرة"
            width={40}
            height={40}
            className="object-contain p-1.5"
            priority
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">واحة الباحث</span>
          <span className="text-xs text-gray-500">جامعة البصرة</span>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB]/10">
            <User className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user.department || "كلية العلوم"}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {menuItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Action Buttons */}
      <div className="border-t border-gray-100 px-4 py-4 space-y-2">
        <Button
          className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm"
          size="sm"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة نشاط
        </Button>
        <Button
          variant="outline"
          className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
          size="sm"
        >
          <Download className="h-4 w-4 ml-2" />
          تصدير CV
        </Button>
      </div>
    </aside>
  );
}
