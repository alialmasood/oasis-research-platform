"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  BookOpen,
  Presentation,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRoles: string[];
}

const adminMenuItems = [
  { href: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/activities", label: "الأنشطة", icon: FileText },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

const researcherMenuItems = [
  { href: "/researcher/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/researcher/activities", label: "أنشطتي", icon: FileText },
  { href: "/researcher/papers", label: "الأوراق العلمية", icon: BookOpen },
  { href: "/researcher/conferences", label: "المؤتمرات", icon: Presentation },
  { href: "/researcher/awards", label: "الجوائز", icon: Award },
  { href: "/researcher/profile", label: "الملف الشخصي", icon: Settings },
];

export function Sidebar({ userRoles }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = userRoles.includes("ADMIN");
  const menuItems = isAdmin ? adminMenuItems : researcherMenuItems;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 border-l border-border bg-sidebar p-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-sidebar-foreground">
          منصة البحث العلمي
        </h2>
        <p className="text-sm text-muted-foreground">جامعة البصرة</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-6 right-6">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          تسجيل الخروج
        </Button>
      </div>
    </aside>
  );
}
