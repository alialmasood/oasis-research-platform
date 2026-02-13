"use client";

import { Heart } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-slate-100 p-6 mb-4">
        <Heart className="h-12 w-12 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد كتب شكر</h3>
      <p className="text-sm text-slate-600 text-center max-w-md">
        ابدأ بإضافة كتاب شكر جديد باستخدام الزر أعلاه
      </p>
    </div>
  );
}
