"use client";

import { Button } from "@/components/ui/button";
import { Plus, FileText, BarChart3, Calendar } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: any;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FileText,
  actionLabel = "إضافة أول نشاط",
  actionHref,
  onActionClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 rounded-full bg-blue-50 p-4">
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-md">{description}</p>
      {actionHref ? (
        <Link href={actionHref}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 ml-2" />
            {actionLabel}
          </Button>
        </Link>
      ) : onActionClick ? (
        <Button onClick={onActionClick} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 ml-2" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
