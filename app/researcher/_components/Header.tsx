"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Users, Menu, LogOut, User, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MobileSidebar } from "./MobileSidebar";

interface HeaderProps {
  userName: string;
  avatarUrl: string | null;
}

const pageTitles: Record<string, string> = {
  "/researcher/dashboard": "لوحة التحكم",
  "/researcher/profile": "الملف الشخصي",
  "/researcher/activities": "النشاطات الأكاديمية",
  "/researcher/activities/research": "الأبحاث",
  "/researcher/activities/conferences": "المؤتمرات",
  "/researcher/activities/positions": "المناصب",
  "/researcher/activities/seminars": "الندوات",
  "/researcher/activities/courses": "الدورات",
  "/researcher/activities/workshops": "ورش العمل",
  "/researcher/activities/assignments": "التكليفات",
  "/researcher/activities/thanks": "كتب الشكر",
  "/researcher/activities/committees": "اللجان",
  "/researcher/activities/certificates": "شهادات المشاركة",
  "/researcher/activities/journals": "إدارة المجلات",
  "/researcher/activities/supervision": "الإشراف على الطلبة",
  "/researcher/activities/reviewing": "التقويم العلمي",
  "/researcher/activities/volunteering": "الأعمال الطوعية",
  "/researcher/activities/field-visits": "الزيارات الميدانية",
  "/researcher/documents": "الوثائق",
  "/researcher/evaluation": "التقييم والنقاط",
  "/researcher/comparison": "المقارنات",
  "/researcher/cv": "السيرة الذاتية",
  "/researcher/cv/edit": "تعديل السيرة الذاتية",
  "/researcher/academic-cv": "السيرة الأكاديمية",
  "/researcher/online": "المتصلون",
  "/researcher/report": "التقرير",
  "/researcher/settings": "الإعدادات",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const sortedPaths = Object.keys(pageTitles).sort((a, b) => b.length - a.length);
  const match = sortedPaths.find((path) => pathname.startsWith(path + "/") || pathname === path);
  return match ? pageTitles[match] : "واحة الباحث";
}

export function Header({ userName, avatarUrl }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pageTitle = getPageTitle(pathname ?? "");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/60 bg-white/80 backdrop-blur-md shadow-sm w-full flex-shrink-0 left-0 right-0 will-change-transform">
      <div className="flex h-16 items-center justify-between gap-4 px-6 w-full">
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0">
            <MobileSidebar user={{ fullName: userName, department: "كلية العلوم" }} />
          </SheetContent>
        </Sheet>

        {/* Page Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Search (Desktop) */}
          <div className="hidden md:flex relative max-w-xs">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="بحث..."
              className="pr-10 h-9 w-64 border-gray-200 focus:border-[#2563EB] focus:ring-[#2563EB]/20"
            />
          </div>

          {/* Online Users Button */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-gray-600 hover:text-gray-900"
            aria-label="المتصلون"
          >
            <Users className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]/10 overflow-hidden">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={userName} fill className="object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-[#2563EB]" />
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {userName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-gray-500">باحث</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/researcher/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  الملف الشخصي
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/researcher/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  الإعدادات
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
