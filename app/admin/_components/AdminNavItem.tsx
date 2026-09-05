"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export function AdminNavItem({ href, label, icon: Icon, disabled }: AdminNavItemProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/admin/dashboard" && pathname?.startsWith(href));

  const content = (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
        isActive
          ? "bg-blue-50 text-[#2563EB]"
          : disabled
            ? "cursor-not-allowed text-gray-400 opacity-50"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 group"
      )}
    >
      {isActive && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-[#2563EB] rounded-l-full" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0 transition-all duration-300",
          isActive
            ? "text-[#2563EB]"
            : disabled
              ? "text-gray-400"
              : "text-gray-500 group-hover:text-gray-700"
        )}
      />
      <span className="flex-1 min-w-0 truncate">{label}</span>
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
