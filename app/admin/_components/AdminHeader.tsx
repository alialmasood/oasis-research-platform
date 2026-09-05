"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell, Search, Menu, LogOut, User, Settings, Shield } from "lucide-react";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { resolvePublicUrl } from "@/lib/utils";
import { AdminMobileSidebar } from "./AdminMobileSidebar";
import { getAdminPageTitle } from "./adminMenuItems";

interface AdminHeaderProps {
  userName: string;
  avatarUrl: string | null;
}

function getPageTitle(pathname: string): string {
  return getAdminPageTitle(pathname);
}

export function AdminHeader({ userName, avatarUrl }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pageTitle = getPageTitle(pathname ?? "");
  const resolvedAvatarUrl = resolvePublicUrl(avatarUrl);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/60 bg-white/80 backdrop-blur-md shadow-sm w-full flex-shrink-0">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 w-full">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0">
            <AdminMobileSidebar
              userName={userName}
              onClose={() => setMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{pageTitle}</h1>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#2563EB]/10 px-2.5 py-0.5 text-xs font-medium text-[#2563EB]">
            <Shield className="h-3 w-3" />
            إدارة
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex relative max-w-xs">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="بحث..."
              className="pr-10 h-9 w-64 border-gray-200 focus:border-[#2563EB] focus:ring-[#2563EB]/20"
            />
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]/10 overflow-hidden">
                  {resolvedAvatarUrl ? (
                    <Image
                      src={resolvedAvatarUrl}
                      alt={userName}
                      fill
                      className="object-cover"
                      unoptimized={
                        resolvedAvatarUrl.startsWith("/api/avatar/") ||
                        resolvedAvatarUrl.startsWith("/avatars/")
                      }
                    />
                  ) : (
                    <Shield className="h-4 w-4 text-[#2563EB]" />
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {userName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-gray-500">مدير النظام</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                <User className="h-4 w-4 ml-2" />
                الملف الشخصي
                <span className="mr-auto text-[10px] text-gray-400">قريباً</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                <Settings className="h-4 w-4 ml-2" />
                الإعدادات
                <span className="mr-auto text-[10px] text-gray-400">قريباً</span>
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
