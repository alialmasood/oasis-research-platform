"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AdminNavItem } from "./AdminNavItem";
import { AdminNavSubItem } from "./AdminNavSubItem";
import type { AdminMenuGroup } from "./adminMenuItems";

interface AdminNavGroupProps {
  group: AdminMenuGroup;
  onNavigate?: () => void;
}

export function AdminNavGroup({ group, onNavigate }: AdminNavGroupProps) {
  const pathname = usePathname();
  const isSectionActive = pathname === group.href || pathname?.startsWith(group.href + "/");

  return (
    <div className="space-y-0.5">
      <AdminNavItem href={group.href} label={group.label} icon={group.icon} />
      {isSectionActive && (
        <div className="mr-4 mr-[1.125rem] border-r border-gray-200 pr-2 space-y-0.5">
          {group.children.map((child) => (
            <AdminNavSubItem key={child.href} item={child} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}
