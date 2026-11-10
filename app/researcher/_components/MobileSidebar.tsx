"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  FileText,
  Award,
  BarChart3,
  FileCheck,
  Download,
  ChevronDown,
  BookMarked,
  ClipboardList,
  Link as LinkIcon,
  Handshake,
  MessageCircle,
  TrendingUp,
  Database,
  BookOpen,
  Presentation,
  Briefcase,
  Users,
  GraduationCap,
  Wrench,
  Heart,
  Map,
  UserCheck,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetClose, SheetDescription, SheetTitle } from "@/components/ui/sheet";

interface MobileSidebarProps {
  user: {
    fullName: string;
    department?: string;
    avatarUrl?: string | null;
  };
  onNavigate?: () => void;
}

const mainItems = [
  { href: "/researcher/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/researcher/profile", label: "الملف الشخصي", icon: User },
  { href: "/researcher/cv", label: "السيرة الذاتية", icon: FileCheck },
  { href: "/researcher/academic-cv", label: "السيرة العلمية", icon: BookMarked },
];

const evaluationItems = [
  { href: "/researcher/evaluation", label: "التقييم والنقاط", icon: Award },
  { href: "/researcher/comparison", label: "المقارنات", icon: BarChart3 },
  { href: "/researcher/analytics", label: "التحليلات الزمنية", icon: TrendingUp },
];

const toolsItems = [
  { href: "/researcher/form-21", label: "استمارة رقم 21", icon: ClipboardList },
  { href: "/researcher/links", label: "روابط الباحث", icon: LinkIcon },
  { href: "/researcher/research-data", label: "البيانات البحثية", icon: Database },
  { href: "/researcher/collaboration", label: "التعاون المشترك", icon: Handshake },
  { href: "/researcher/communication", label: "التواصل", icon: MessageCircle },
];

const activityItems = [
  { href: "/researcher/activities/research", label: "البحوث", icon: BookOpen },
  { href: "/researcher/activities/conferences", label: "المؤتمرات", icon: Presentation },
  { href: "/researcher/activities/positions", label: "المناصب", icon: Briefcase },
  { href: "/researcher/activities/seminars", label: "الندوات", icon: Users },
  { href: "/researcher/activities/courses", label: "الدورات", icon: GraduationCap },
  { href: "/researcher/activities/workshops", label: "ورش العمل", icon: Wrench },
  { href: "/researcher/activities/assignments", label: "التكليفات", icon: ClipboardList },
  { href: "/researcher/activities/thanks", label: "كتب الشكر", icon: Award },
  { href: "/researcher/activities/committees", label: "اللجان", icon: ClipboardList },
  { href: "/researcher/activities/certificates", label: "شهادات المشاركة", icon: Award },
  { href: "/researcher/activities/journals", label: "إدارة المجلات", icon: FileText },
  { href: "/researcher/activities/supervision", label: "الإشراف على الطلبة", icon: UserCheck },
  { href: "/researcher/activities/reviewing", label: "التقويم العلمي", icon: Calendar },
  { href: "/researcher/activities/volunteering", label: "الأعمال الطوعية", icon: Heart },
  { href: "/researcher/activities/field-visits", label: "الزيارات الميدانية", icon: Map },
];

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/researcher/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
  onNavigate,
  nested = false,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <SheetClose asChild>
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors",
          nested ? "px-3 py-2 me-1" : "px-3 py-2.5",
          active
            ? "bg-blue-50 text-[#2563EB]"
            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        {active && (
          <span className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-l-full bg-[#2563EB]" />
        )}
        <Icon
          className={cn(
            "flex-shrink-0",
            nested ? "h-3.5 w-3.5" : "h-4 w-4",
            active ? "text-[#2563EB]" : "text-slate-400"
          )}
        />
        <span className="min-w-0 truncate">{label}</span>
      </Link>
    </SheetClose>
  );
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h3 className="px-3 pt-1 pb-1.5 text-[11px] font-semibold text-slate-400 tracking-wide">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function MobileSidebar({ user, onNavigate }: MobileSidebarProps) {
  const pathname = usePathname();
  const isActivitiesPage = pathname?.startsWith("/researcher/activities") ?? false;
  const [activitiesOpen, setActivitiesOpen] = useState(isActivitiesPage);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-white">
      <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
      <SheetDescription className="sr-only">
        قائمة صفحات الباحث في جامعة البصرة
      </SheetDescription>

      {/* Brand */}
      <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 pe-12 flex-shrink-0">
        <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-white shadow-sm border border-slate-100 flex-shrink-0">
          <Image
            src="/uob-logo.png"
            alt="شعار جامعة البصرة"
            width={44}
            height={44}
            className="object-contain p-1"
            priority
          />
        </div>
        <div className="flex flex-col min-w-0 leading-tight pt-0.5">
          <span className="text-[11px] text-slate-500">جامعة البصرة</span>
          <span className="text-sm font-semibold text-slate-900 truncate">واحة الباحث</span>
          <span className="text-[10px] text-slate-400 mt-0.5 truncate">Oasis Research Platform</span>
        </div>
      </div>

      {/* User */}
      <div className="border-b border-slate-100 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-2.5 py-2">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB]/10 overflow-hidden flex-shrink-0">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.fullName}
                fill
                className="object-cover"
                unoptimized={
                  user.avatarUrl.startsWith("/api/avatar/") ||
                  user.avatarUrl.startsWith("/avatars/")
                }
              />
            ) : (
              <User className="h-4 w-4 text-[#2563EB]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user.fullName}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {user.department || "كلية العلوم"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-4">
        <NavGroup title="الرئيسية">
          {mainItems.map((item) => (
            <MobileNavLink key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </NavGroup>

        <NavGroup title="النشاطات">
          <button
            type="button"
            onClick={() => setActivitiesOpen((v) => !v)}
            className={cn(
              "relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              activitiesOpen || isActivitiesPage
                ? "bg-blue-50 text-[#2563EB]"
                : "text-slate-700 hover:bg-slate-50"
            )}
          >
            {(activitiesOpen || isActivitiesPage) && (
              <span className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-l-full bg-[#2563EB]" />
            )}
            <span className="flex items-center gap-3 min-w-0">
              <FileText
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  activitiesOpen || isActivitiesPage ? "text-[#2563EB]" : "text-slate-400"
                )}
              />
              <span className="truncate">النشاطات الأكاديمية</span>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                activitiesOpen ? "rotate-180 text-[#2563EB]" : "text-slate-400"
              )}
            />
          </button>

          {activitiesOpen && (
            <div className="mt-1 ms-2 border-s border-slate-200 ps-2 space-y-0.5">
              {activityItems.map((item) => (
                <MobileNavLink
                  key={item.href}
                  {...item}
                  nested
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </NavGroup>

        <NavGroup title="التقييم والمقارنات">
          {evaluationItems.map((item) => (
            <MobileNavLink key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </NavGroup>

        <NavGroup title="أدوات الباحث">
          {toolsItems.map((item) => (
            <MobileNavLink key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </NavGroup>
      </nav>

      {/* Footer action */}
      <div className="border-t border-slate-100 px-3 py-3 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <SheetClose asChild>
          <Link
            href="/researcher/cv/export"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
            className="inline-flex h-9 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4 ml-2" />
            تصدير CV
          </Link>
        </SheetClose>
      </div>
    </aside>
  );
}
