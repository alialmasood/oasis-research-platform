"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageIcon, UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { FacultyMember } from "@/lib/admin/facultyTypes";

interface FacultyAvatarMenuProps {
  member: FacultyMember;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function FacultyAvatarMenu({ member }: FacultyAvatarMenuProps) {
  const router = useRouter();
  const [avatarOpen, setAvatarOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "relative flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full",
              "bg-[#2563EB]/10 border border-[#2563EB]/20",
              "cursor-pointer transition-all hover:ring-2 hover:ring-[#2563EB]/30 hover:scale-105",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            )}
            aria-label={`خيارات ${member.displayName}`}
          >
            {member.avatarUrl ? (
              <Image
                src={member.avatarUrl}
                alt={member.displayName}
                fill
                className="object-cover"
                unoptimized={
                  member.avatarUrl.startsWith("/api/avatar/") ||
                  member.avatarUrl.startsWith("/avatars/")
                }
              />
            ) : (
              <span className="text-xs font-semibold text-[#2563EB]">
                {getInitials(member.displayName)}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem
            disabled={!member.avatarUrl}
            onClick={() => setAvatarOpen(true)}
            className="cursor-pointer gap-2"
          >
            <ImageIcon className="h-4 w-4 text-[#2563EB]" />
            عرض الصورة الشخصية
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/admin/faculty/${member.id}`)}
            className="cursor-pointer gap-2"
          >
            <UserCircle className="h-4 w-4 text-[#2563EB]" />
            عرض بروفايل التدريسي
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">الصورة الشخصية — {member.displayName}</DialogTitle>
          </DialogHeader>
          {member.avatarUrl ? (
            <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <Image
                src={member.avatarUrl}
                alt={member.displayName}
                fill
                className="object-cover"
                unoptimized={
                  member.avatarUrl.startsWith("/api/avatar/") ||
                  member.avatarUrl.startsWith("/avatars/")
                }
              />
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500 py-8">لا توجد صورة شخصية</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
