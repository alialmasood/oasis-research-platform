import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Presentation,
  type LucideIcon,
} from "lucide-react";

export type AdminMenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
};

export type AdminSubMenuItem = {
  href: string;
  label: string;
  /** مطابقة دقيقة فقط (مثل /admin/research) */
  exact?: boolean;
};

export type AdminMenuGroup = {
  href: string;
  label: string;
  icon: LucideIcon;
  children: AdminSubMenuItem[];
};

export type AdminDataNavEntry = AdminMenuItem | AdminMenuGroup;

export function isAdminMenuGroup(entry: AdminDataNavEntry): entry is AdminMenuGroup {
  return "children" in entry;
}

/** تبويبات فرعية لقسم البحوث — أضف عناصر جديدة هنا */
export const adminResearchSubMenuItems: AdminSubMenuItem[] = [
  { href: "/admin/research", label: "رؤية شاملة", exact: true },
  { href: "/admin/research/indicators", label: "مؤشرات الباحثين" },
  { href: "/admin/research/international", label: "البحوث العالمية" },
  { href: "/admin/research/scopus", label: "بحوث سكوبس" },
  { href: "/admin/research/evaluation", label: "تقييم وانجازات" },
];

export const adminMainMenuItems: AdminMenuItem[] = [
  { href: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
];

export const adminDataMenuItems: AdminDataNavEntry[] = [
  { href: "/admin/faculty", label: "التدريسيون", icon: GraduationCap },
  {
    href: "/admin/research",
    label: "البحوث",
    icon: BookOpen,
    children: adminResearchSubMenuItems,
  },
  { href: "/admin/conferences", label: "المؤتمرات", icon: Presentation },
];

export const adminMobileMenuItems: (AdminMenuItem | AdminMenuGroup)[] = [
  ...adminMainMenuItems,
  ...adminDataMenuItems,
];

export const adminPageTitles: Record<string, string> = {
  "/admin/dashboard": "لوحة التحكم",
  "/admin/faculty": "التدريسيون",
  "/admin/research": "البحوث — رؤية شاملة",
  "/admin/research/indicators": "البحوث — مؤشرات الباحثين",
  "/admin/research/international": "البحوث — العالمية",
  "/admin/research/scopus": "البحوث — سكوبس",
  "/admin/research/evaluation": "البحوث — تقييم وانجازات",
  "/admin/conferences": "المؤتمرات",
};

/** عنوان الصفحة من المسار */
export function getAdminPageTitle(pathname: string): string {
  if (adminPageTitles[pathname]) return adminPageTitles[pathname];
  if (/^\/admin\/faculty\/[^/]+$/.test(pathname)) return "بروفايل التدريسي";
  const match = Object.keys(adminPageTitles)
    .filter((p) => p !== "/admin/research")
    .find((path) => pathname.startsWith(path + "/"));
  if (match) return adminPageTitles[match];
  if (pathname.startsWith("/admin/research")) return "البحوث";
  return "لوحة الإدارة";
}
