import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminFooter({ wide = false }: { wide?: boolean }) {
  return (
    <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm flex-shrink-0 print:hidden">
      <div
        className={cn(
          "mx-auto py-3",
          wide
            ? "w-full max-w-[calc(100vw-0.75rem)] md:max-w-[calc(100vw-16.5rem)] px-2 sm:px-3 lg:px-4"
            : "max-w-[1200px] xl:max-w-[1400px] 2xl:max-w-[1500px] px-4 sm:px-6 lg:px-8"
        )}
      >        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>واحة الباحث — جامعة البصرة · لوحة الإدارة</span>
          </div>
          <div>© {new Date().getFullYear()} جميع الحقوق محفوظة</div>
        </div>
      </div>
    </footer>
  );
}
