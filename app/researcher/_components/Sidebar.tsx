"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ChevronDown,
  ChevronUp,
  Presentation,
  GraduationCap,
  Wrench,
  ClipboardList,
  BookMarked,
  Link as LinkIcon,
  Handshake,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: {
    fullName: string;
    department?: string;
  };
  onActivitiesToggle?: () => void;
  isActivitiesOpen?: boolean;
}

interface NavItemProps {
  href: string;
  label: string;
  icon: any;
  isActive?: boolean;
  disabled?: boolean;
}

function NavItem({ href, label, icon: Icon, isActive, disabled }: NavItemProps) {
  const pathname = usePathname();
  // تحديد التبويب النشط تلقائياً
  const isActuallyActive = isActive !== undefined 
    ? isActive 
    : pathname === href || (href !== "/researcher/dashboard" && pathname?.startsWith(href));

  const content = (
    <div
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
        isActuallyActive
          ? "bg-blue-50 text-[#2563EB]"
          : disabled
          ? "text-gray-400 opacity-50 cursor-not-allowed"
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 group"
      )}
    >
      {/* Active indicator - خط عمودي أزرق على اليمين */}
      {isActuallyActive && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-[#2563EB] rounded-l-full transition-all duration-300" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0 transition-all duration-300",
          isActuallyActive
            ? "text-[#2563EB]"
            : disabled
            ? "text-gray-400"
            : "text-gray-500 group-hover:text-gray-700 group-hover:scale-110"
        )}
      />
      <span
        className={cn(
          "flex-1 min-w-0 truncate transition-all duration-300",
          !isActuallyActive && !disabled && "group-hover:translate-x-[-2px]"
        )}
      >
        {label}
      </span>
    </div>
  );

  if (disabled) {
    return (
      <div className="relative group/tooltip">
        {content}
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          قريباً
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent" />
        </div>
      </div>
    );
  }

  return <Link href={href}>{content}</Link>;
}

interface NavGroupProps {
  title: string;
  children: React.ReactNode;
}

function NavGroup({ title, children }: NavGroupProps) {
  return (
    <div className="space-y-1">
      <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function Sidebar({ user, onActivitiesToggle, isActivitiesOpen = false }: SidebarProps) {
  const pathname = usePathname();
  const isActivitiesPage = pathname?.startsWith("/researcher/activities");

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 min-w-[256px] max-w-[256px] z-40 flex flex-col border-l border-gray-200 bg-white shadow-lg overflow-x-hidden">
      {/* Logo & Brand */}
      <div className="border-b border-gray-100 px-6 py-5 flex-shrink-0">
        <div className="flex items-start gap-3">
          <Image
            src="/uob-logo.png"
            alt="شعار جامعة البصرة"
            width={56}
            height={56}
            className="object-contain flex-shrink-0"
            priority
          />
          <div className="flex flex-col items-start leading-tight mt-1 min-w-0 flex-1">
            <span className="text-xs text-slate-500 mb-1 truncate w-full">جامعة البصرة</span>
            <span className="text-sm font-semibold text-slate-900 truncate w-full">واحة الباحث</span>
            <span className="text-[11px] font-medium text-slate-500 tracking-wide truncate w-full mt-0.5">
              Oasis Research Platform
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4">
        {/* المجموعة الرئيسية */}
        <NavGroup title="الرئيسية">
          <NavItem
            href="/researcher/dashboard"
            label="لوحة التحكم"
            icon={LayoutDashboard}
            isActive={pathname === "/researcher/dashboard"}
          />
          <NavItem
            href="/researcher/profile"
            label="الملف الشخصي"
            icon={User}
            isActive={pathname === "/researcher/profile"}
          />
          <NavItem
            href="/researcher/cv"
            label="السيرة الذاتية"
            icon={FileCheck}
            isActive={pathname === "/researcher/cv"}
          />
          <NavItem
            href="/researcher/academic-cv"
            label="السيرة العلمية"
            icon={BookMarked}
            isActive={pathname === "/researcher/academic-cv"}
          />
        </NavGroup>

        {/* النشاطات الأكاديمية - Toggle Button */}
        <NavGroup title="النشاطات">
          <button
            onClick={onActivitiesToggle}
            className={cn(
              "relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group min-w-0",
              isActivitiesOpen || isActivitiesPage
                ? "bg-blue-50 text-[#2563EB] shadow-sm"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {/* Active indicator - خط جانبي */}
            {(isActivitiesOpen || isActivitiesPage) && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#2563EB] rounded-l-full transition-all duration-300" />
            )}
            {/* Active glow effect */}
            {(isActivitiesOpen || isActivitiesPage) && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-400/30 rounded-l-full blur-sm transition-all duration-300" />
            )}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="relative">
                <FileText
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-all duration-300 relative z-10",
                    isActivitiesOpen || isActivitiesPage
                      ? "text-[#2563EB]"
                      : "text-gray-500 group-hover:text-gray-700 group-hover:scale-110"
                  )}
                />
                {/* Active dot indicator */}
                {(isActivitiesOpen || isActivitiesPage) && (
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full border-2 border-white transition-all duration-300" />
                )}
              </div>
              <span className="min-w-0 truncate transition-all duration-300 group-hover:translate-x-[-2px]">
                النشاطات الأكاديمية
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-300 flex-shrink-0",
                isActivitiesOpen ? "rotate-180 text-[#2563EB]" : "text-gray-400"
              )}
            />
          </button>
        </NavGroup>

        {/* التقييم والمقارنات */}
        <NavGroup title="التقييم والمقارنات">
          <NavItem
            href="/researcher/evaluation"
            label="التقييم والنقاط"
            icon={Award}
            isActive={pathname === "/researcher/evaluation"}
          />
          <NavItem
            href="/researcher/comparison"
            label="المقارنات"
            icon={BarChart3}
            isActive={pathname === "/researcher/comparison"}
          />
          <NavItem
            href="/researcher/analytics"
            label="التحليلات الزمنية"
            icon={TrendingUp}
            isActive={pathname === "/researcher/analytics"}
          />
        </NavGroup>

        {/* أدوات الباحث */}
        <NavGroup title="أدوات الباحث">
          <NavItem
            href="/researcher/form-21"
            label="استمارة رقم 21"
            icon={ClipboardList}
            isActive={pathname === "/researcher/form-21" || pathname?.startsWith("/researcher/form-21")}
          />
          <NavItem
            href="/researcher/links"
            label="روابط الباحث"
            icon={LinkIcon}
            isActive={pathname === "/researcher/links"}
          />
          <NavItem
            href="/researcher/collaboration"
            label="التعاون المشترك"
            icon={Handshake}
            isActive={pathname === "/researcher/collaboration"}
          />
          <NavItem
            href="/researcher/communication"
            label="التواصل"
            icon={MessageCircle}
            isActive={pathname === "/researcher/communication"}
          />
        </NavGroup>
      </nav>

      {/* Action Buttons */}
      <div className="border-t border-gray-100 px-4 py-4 space-y-2 flex-shrink-0">
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
