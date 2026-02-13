"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function NavItem({ href, label, icon: Icon }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link href={href}>
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-[#2563EB]/10 text-[#2563EB]"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        {isActive && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-l-full bg-[#2563EB]" />
        )}
        <Icon
          className={cn(
            "h-5 w-5 flex-shrink-0",
            isActive ? "text-[#2563EB]" : "text-gray-400 group-hover:text-gray-600"
          )}
        />
        <span>{label}</span>
      </div>
    </Link>
  );
}
