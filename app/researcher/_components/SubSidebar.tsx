"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Presentation,
  Briefcase,
  Users,
  GraduationCap,
  Wrench,
  ClipboardList,
  Award,
  FileText,
  UserCheck,
  Calendar,
  Heart,
  Map,
} from "lucide-react";
import type { ResearcherActivityCounts } from "@/lib/researcherActivityCounts";

interface SubSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  counts: ResearcherActivityCounts;
}

function buildAcademicActivitiesItems(counts: ResearcherActivityCounts) {
  return [
    { href: "/researcher/activities/research", label: "البحوث", icon: BookOpen, count: counts.research },
    {
      href: "/researcher/activities/conferences",
      label: "المؤتمرات",
      icon: Presentation,
      count: counts.conferences,
    },
    { href: "/researcher/activities/positions", label: "المناصب", icon: Briefcase, count: counts.positions },
    { href: "/researcher/activities/seminars", label: "الندوات", icon: Users, count: counts.seminars },
    { href: "/researcher/activities/courses", label: "الدورات", icon: GraduationCap, count: counts.courses },
    { href: "/researcher/activities/workshops", label: "ورش العمل", icon: Wrench, count: counts.workshops },
    {
      href: "/researcher/activities/assignments",
      label: "التكليفات",
      icon: ClipboardList,
      count: counts.assignments,
    },
    { href: "/researcher/activities/thanks", label: "كتب الشكر", icon: Award, count: counts.thanks },
    { href: "/researcher/activities/committees", label: "اللجان", icon: ClipboardList, count: counts.committees },
    {
      href: "/researcher/activities/certificates",
      label: "شهادات المشاركة",
      icon: Award,
      count: counts.certificates,
    },
    { href: "/researcher/activities/journals", label: "إدارة المجلات", icon: FileText, count: counts.journals },
    {
      href: "/researcher/activities/supervision",
      label: "الإشراف على الطلبة",
      icon: UserCheck,
      count: counts.supervision,
    },
    {
      href: "/researcher/activities/reviewing",
      label: "التقويم العلمي",
      icon: Calendar,
      count: counts.reviewing,
    },
    {
      href: "/researcher/activities/volunteering",
      label: "الأعمال الطوعية",
      icon: Heart,
      count: counts.volunteering,
    },
    { href: "/researcher/activities/field-visits", label: "الزيارات الميدانية", icon: Map, count: counts.fieldVisits },
  ];
}

export function SubSidebar({ isOpen, onClose, counts }: SubSidebarProps) {
  const pathname = usePathname();
  const academicActivitiesItems = buildAcademicActivitiesItems(counts);

  return (
    <>
      {/* غشاء خفيف خلف القائمة عند الفتح (لا يزيح المحتوى) */}
      <div
        className={cn(
          "fixed inset-0 z-20 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{
          background: "rgba(0, 0, 0, 0.08)",
          marginRight: "256px",
        }}
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed right-64 top-0 h-screen w-[280px] bg-white border-l border-gray-200 shadow-lg overflow-hidden z-30",
          "transition-all duration-[220ms] ease-out",
          isOpen 
            ? "opacity-100 translate-x-0" 
            : "opacity-0 translate-x-3 pointer-events-none"
        )}
        style={{
          boxShadow: isOpen 
            ? "-4px 0 12px rgba(0, 0, 0, 0.04), -1px 0 0 rgba(0, 0, 0, 0.04)" 
            : "none"
        }}
      >
      <div className="sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto flex flex-col scrollbar-hide">
        {/* Close Button - Top Right */}
        <div className="flex justify-end p-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
          {academicActivitiesItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-blue-50 border-r-4 border-blue-500 text-blue-700 shadow-sm"
                    : "text-gray-700 hover:bg-slate-50 hover:translate-x-1"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0 transition-all duration-200",
                      isActive
                        ? "text-blue-600"
                        : "text-slate-500 group-hover:text-blue-600"
                    )}
                  />
                  <span className="flex-1 min-w-0 truncate text-sm font-medium">{item.label}</span>
                </div>
                {/* Count Badge */}
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full transition-all duration-200 flex-shrink-0",
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600"
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
    </>
  );
}
