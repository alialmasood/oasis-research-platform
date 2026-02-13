"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { SubSidebar } from "./SubSidebar";
import { Header } from "./Header";
import type { ResearcherActivityCounts } from "@/lib/researcherActivityCounts";
import { onDashboardUpdate } from "@/lib/dashboardSync";

interface ResearcherLayoutClientProps {
  user: {
    fullName: string;
    roles: string[];
    avatarUrl: string | null;
  };
  activityCounts: ResearcherActivityCounts;
  children: React.ReactNode;
}

export function ResearcherLayoutClient({
  user,
  activityCounts,
  children,
}: ResearcherLayoutClientProps) {
  const pathname = usePathname();
  const [isSubSidebarOpen, setIsSubSidebarOpen] = useState(false);
  const [counts, setCounts] = useState(activityCounts);

  // إغلاق القائمة الثانوية فقط عند الخروج من صفحات النشاطات (بدون فتح تلقائي عند التحميل)
  useEffect(() => {
    if (!pathname?.startsWith("/researcher/activities")) {
      setIsSubSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    setCounts(activityCounts);
  }, [activityCounts]);

  useEffect(() => {
    return onDashboardUpdate(() => {
      fetch("/api/researcher/activity-counts")
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { counts?: ResearcherActivityCounts } | null) => {
          if (data?.counts) setCounts(data.counts);
        })
        .catch(() => undefined);
    });
  }, []);

  const handleActivitiesToggle = () => {
    setIsSubSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-dvh min-h-screen bg-[#F5F7FB] w-full max-w-full overflow-x-hidden">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 pointer-events-none z-0" />

      {/* Sidebar - Fixed on desktop; on mobile use Header menu (Drawer) */}
      <div className="hidden md:block print:hidden dashboard-print-hide">
      <Sidebar
        user={{ fullName: user.fullName, department: "كلية العلوم" }}
        onActivitiesToggle={handleActivitiesToggle}
        isActivitiesOpen={isSubSidebarOpen}
      />
      </div>

      {/* SubSidebar - فوق المحتوى بدون إزاحة الصفحة */}
      <div className="print:hidden dashboard-print-hide">
      <SubSidebar
        isOpen={isSubSidebarOpen}
        onClose={() => setIsSubSidebarOpen(false)}
        counts={counts}
      />
      </div>

      {/* Main Content Area - عرض ثابت؛ بالموبايل بدون إزاحة (السايدبار في Drawer) */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10 mr-0 md:mr-64">
        {/* Header - Sticky */}
        <div className="w-full flex-shrink-0 sticky top-0 z-30 print:hidden dashboard-print-hide">
          <Header userName={user.fullName} avatarUrl={user.avatarUrl} />
        </div>

        {/* Page Content - Container with max-width */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] xl:max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
