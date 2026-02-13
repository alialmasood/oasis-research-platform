"use client";

import { ClipboardList } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-slate-100 p-6 mb-4">
        <ClipboardList className="h-12 w-12 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد تكليفات</h3>
      <p className="text-sm text-slate-600 text-center max-w-md">
        ابدأ بإضافة تكليف جديد باستخدام الزر أعلاه
      </p>
    </div>
  );
}
