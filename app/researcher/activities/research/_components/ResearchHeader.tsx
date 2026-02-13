"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ResearchHeaderProps {
  onAddClick: () => void;
}

export function ResearchHeader({ onAddClick }: ResearchHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">الأبحاث</h1>
      <Button onClick={onAddClick} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
        <Plus className="h-4 w-4 ml-2" />
        إضافة بحث
      </Button>
    </div>
  );
}
