"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AdminSubMenuItem } from "./adminMenuItems";

interface AdminNavSubItemProps {
  item: AdminSubMenuItem;
  onNavigate?: () => void;
}

export function AdminNavSubItem({ item, onNavigate }: AdminNavSubItemProps) {
  const pathname = usePathname();
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname?.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "block rounded-lg py-2 pr-3 pl-2 text-xs font-medium transition-colors truncate",
        isActive
          ? "bg-[#2563EB]/10 text-[#2563EB]"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      {item.label}
    </Link>
  );
}
