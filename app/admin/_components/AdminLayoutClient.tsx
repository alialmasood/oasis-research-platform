"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminFooter } from "./AdminFooter";

interface AdminLayoutClientProps {
  user: {
    fullName: string;
    avatarUrl: string | null;
  };
  children: React.ReactNode;
}

/** صفحات تحتاج عرضاً كاملاً (جداول واسعة) */
const WIDE_PAGE_PREFIXES = ["/admin/faculty", "/admin/research", "/admin/conferences"];

export function AdminLayoutClient({ user, children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const isWidePage = WIDE_PAGE_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  return (
    <div
      className={cn(
        "min-h-dvh min-h-screen bg-[#F5F7FB] w-full flex flex-col",
        isWidePage ? "overflow-x-auto" : "max-w-full overflow-x-hidden"
      )}
    >
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 pointer-events-none z-0" />

      <div className="hidden md:block print:hidden">
        <AdminSidebar userName={user.fullName} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col relative z-10 mr-0 md:mr-64">
        <div className="w-full flex-shrink-0 sticky top-0 z-30 print:hidden">
          <AdminHeader userName={user.fullName} avatarUrl={user.avatarUrl} />
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-visible">
          <div
            className={cn(
              "mx-auto py-4 lg:py-5",
              isWidePage
                ? "w-full max-w-[calc(100vw-0.75rem)] md:max-w-[calc(100vw-16.5rem)] px-2 sm:px-3 lg:px-4"
                : "max-w-[1200px] xl:max-w-[1400px] 2xl:max-w-[1500px] px-4 sm:px-6 lg:px-8"
            )}
          >
            {children}
          </div>
        </main>

        <AdminFooter wide={isWidePage} />
      </div>
    </div>
  );
}
