"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ResearchHeaderProps {
  onAddClick: () => void;
}

export function ResearchHeader({ onAddClick }: ResearchHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3 md:mb-6">
      <div className="min-w-0">
        <h1 className="text-base md:text-2xl font-semibold text-gray-900 truncate">الأبحاث</h1>
        <p className="text-[11px] md:hidden text-slate-500 mt-0.5">إدارة البحوث والمنشورات</p>
      </div>
      <Button
        onClick={onAddClick}
        size="sm"
        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-8 md:h-10 shrink-0 px-2.5 md:px-4 text-xs md:text-sm"
      >
        <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
        <span className="md:hidden">إضافة</span>
        <span className="hidden md:inline">إضافة بحث</span>
      </Button>
    </div>
  );
}
